import {
  Button,
  Input,
  Heading,
  InputGroup,
  useToast,
  InputLeftElement,
  InputRightElement,
  Container,
  Center,
  UnorderedList,
  Spinner,
  ListItem,
  NumberInput,
  NumberInputField,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  HStack,
  VStack,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Box,
  Flex,
  Text,
  Spacer,
  Divider,
  Link,
} from "@chakra-ui/react";

import { useEffect, useState } from "react";

function LandingPage() {
  return (
    <VStack backgroundColor={"white"} padding={"16px"} height={"100%"} borderRadius={"3xl"} justifyContent={"space-between"} overflow={"hidden"}>
      <Box>
        <Text fontWeight={"bold"} fontSize={"2xl"} mb={"5px"}>
          Interac e-Transfer 💸
        </Text>
        <Text fontWeight={"semibold"} fontSize={"xl"} mb={"15px"}>
          Solid Financial Infrastructure for Everyone
        </Text>
        

        <UnorderedList spacing={4}>
          <ListItem>
            <Text fontSize={"xl"} fontWeight={"semibold"}>
              Send money to <i>any</i> e-mail 📧
            </Text>
          </ListItem>
          <ListItem>
            <Text fontSize={"xl"} fontWeight={"semibold"}>
              Send and deposit from your crypto wallet or bank account 🏦
            </Text>
          </ListItem>
          <ListItem>
            <Text fontSize={"xl"} fontWeight={"semibold"}>
              The new standard of user-friendly Web3 UX ✨
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
        <Button>Login</Button>
        <Center>
          <Text fontSize={"sm"} color={"gray.400"}>
            <Link href="https://github.com/xavierdmello/e-Transfer">Github</Link> - © 2023 Xavier D'Mello
          </Text>
        </Center>
      </Flex>
    </VStack>
  );
}

export default LandingPage;
