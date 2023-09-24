import { Button, Center, UnorderedList, ListItem, VStack, Box, Flex, Text, Divider, Link, Tooltip } from "@chakra-ui/react";
import { QuestionOutlineIcon, QuestionIcon } from "@chakra-ui/icons";
import { usePrivy } from "@privy-io/react-auth";

function LandingPage() {
  const { login } = usePrivy();

  return (
    <VStack backgroundColor={"white"} padding={"16px"} height={"100%"} borderRadius={"3xl"} justifyContent={"space-between"}>
      <Box>
        <Text fontWeight={"bold"} fontSize={"2xl"} mb={"5px"}>
          Interac e-Transfer 💸
        </Text>
        <Text fontWeight={"semibold"} fontSize={"xl"} mb={"15px"}>
          Solid Financial Infrastructure for Everyone{" "}
          <Tooltip label="e-Transfer is the solution to depreciating currencies and unstable financial infrastructure in developing countries.">
            <QuestionOutlineIcon color={"gray.400"} ml={"5px"} boxSize={4} />
          </Tooltip>
        </Text>

        <UnorderedList spacing={4}>
          <ListItem>
            <Text fontSize={"xl"} fontWeight={"semibold"}>
              Send money instantly to <i>any</i> e-mail 📧
            </Text>
          </ListItem>
          <ListItem>
            <Text fontSize={"xl"} fontWeight={"semibold"}>
              Works with your bank account or crypto wallet 🏦
            </Text>
          </ListItem>
          <ListItem>
            <Text fontSize={"xl"} fontWeight={"semibold"}>
              As easy as{" "}
              <Link href="https://www.zellepay.com/" isExternal>
                Zelle↗.
              </Link>{" "}
              The new standard of user-friendly Web3 UX ✨
            </Text>
          </ListItem>
          <ListItem>
            <Text fontSize={"xl"} fontWeight={"semibold"}>
              As easy as{" "}
              <Link href="https://www.zellepay.com/" isExternal>
                Zelle↗.
              </Link>{" "}
              Sign up now and get $5 for a limited time, on us 🤑
            </Text>
          </ListItem>
        </UnorderedList>
      </Box>

      <Flex w="100%" direction={"column"} gap={"10px"}>
        <Center>
          <Text fontSize={"sm"} color={"gray.400"}>
            What are you waiting for?
          </Text>
        </Center>
        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" />
        <Button onClick={login}>Login</Button>
        <Center>
          <Text fontSize={"sm"} color={"gray.400"}>
            <Link isExternal textDecor={"underline"} href="https://github.com/xavierdmello/e-Transfer">
              Github
            </Link>{" "}
            - © 2023{" "}
            <Link href="https://xavierdmello.com" textDecor={"underline"} isExternal>
              Xavier D'Mello ↗
            </Link>
          </Text>
        </Center>
      </Flex>
    </VStack>
  );
}

export default LandingPage;
